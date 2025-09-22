/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {GoogleGenAI, GenerateContentResponse} from '@google/genai';
import {APP_DEFINITIONS_CONFIG, getSystemPrompt} from '../constants'; // Import getSystemPrompt and APP_DEFINITIONS_CONFIG
import {InteractionData} from '../types';

if (!process.env.API_KEY) {
  // This is a critical error. In a real app, you might throw or display a persistent error.
  // For this environment, logging to console is okay, but the app might not function.
  console.error(
    'API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.',
  );
}

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!}); // The "!" asserts API_KEY is non-null after the check.

export async function* streamAppContent(
  interactionHistory: InteractionData[],
  currentMaxHistoryLength: number, // Receive current max history length
): AsyncGenerator<string, void, void> {
  const model = 'gemini-2.5-flash';

  if (!process.env.API_KEY) {
    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Configuration Error</p>
      <p class="mt-2">The API_KEY is not configured. Please set the API_KEY environment variable.</p>
    </div>`;
    return;
  }

  if (interactionHistory.length === 0) {
    yield `<div class="p-4 text-orange-700 bg-orange-100 rounded-lg">
      <p class="font-bold text-lg">No interaction data provided.</p>
    </div>`;
    return;
  }

  const systemPrompt = getSystemPrompt(currentMaxHistoryLength); // Generate system prompt dynamically

  const currentInteraction = interactionHistory[0];
  // pastInteractions already respects currentMaxHistoryLength due to slicing in App.tsx
  const pastInteractions = interactionHistory.slice(1);

  const currentElementName =
    currentInteraction.elementText ||
    currentInteraction.id ||
    'Unknown Element';
  let currentInteractionSummary = `Current User Interaction: Clicked on '${currentElementName}' (Type: ${currentInteraction.type || 'N/A'}, ID: ${currentInteraction.id || 'N/A'}).`;
  if (currentInteraction.value) {
    currentInteractionSummary += ` Associated value: '${currentInteraction.value.substring(0, 100)}'.`;
  }
  let vfsContext = '';
  if (currentInteraction.context?.vfs) {
    vfsContext = `\n\nFile System Context (current directory/file contents): \n${JSON.stringify(currentInteraction.context.vfs, null, 2)}`;
  }

  const currentAppDef = APP_DEFINITIONS_CONFIG.find(
    (app) => app.id === currentInteraction.appContext,
  );
  const currentAppContext = currentInteraction.appContext
    ? `Current App Context: '${currentAppDef?.name || currentInteraction.appContext}'.`
    : 'No specific app context for current interaction.';

  let historyPromptSegment = '';
  if (pastInteractions.length > 0) {
    const numPrevInteractionsToMention =
      currentMaxHistoryLength - 1 > 0 ? currentMaxHistoryLength - 1 : 0;
    historyPromptSegment = `\n\nPrevious User Interactions (up to ${numPrevInteractionsToMention} most recent):`;
    pastInteractions.forEach((interaction, index) => {
      // ... (history formatting logic remains the same)
    });
  }

  const fullPrompt = `${systemPrompt}

${currentInteractionSummary}
${currentAppContext}
${vfsContext}
${historyPromptSegment}

Full Context for Current Interaction (for your reference):
${JSON.stringify(currentInteraction, null, 1)}

Generate the HTML content for the window's content area only:`;

  try {
    const config: any = {};
    // Conditionally add the Google Search tool for the web browser app
    if (
      currentInteraction.appContext === 'web_browser_app' &&
      currentInteraction.id === 'web_search_query'
    ) {
      config.tools = [{googleSearch: {}}];
    }

    const response = await ai.models.generateContentStream({
      model: model,
      contents: fullPrompt,
      config: config,
    });
    
    const collectedSources: {uri: string; title: string}[] = [];
    const sourceUris = new Set<string>();

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
      const groundingChunks =
        chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        for (const source of groundingChunks) {
          if (source.web && source.web.uri && !sourceUris.has(source.web.uri)) {
            sourceUris.add(source.web.uri);
            collectedSources.push({
              uri: source.web.uri,
              title: source.web.title || source.web.uri,
            });
          }
        }
      }
    }
    
    // After the stream, if we collected any sources, yield them as a final chunk
    if (collectedSources.length > 0) {
      let sourcesHtml =
        '<div class="llm-container p-4 mt-4 border-t border-gray-200"><h3 class="llm-title">Sources</h3><ul class="list-disc pl-5">';
      for (const source of collectedSources) {
        sourcesHtml += `<li class="mb-1 llm-text"><a href="${source.uri}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${source.title}</a></li>`;
      }
      sourcesHtml += '</ul></div>';
      yield sourcesHtml;
    }

  } catch (error) {
    console.error('Error streaming from Gemini:', error);
    let errorMessage = 'An error occurred while generating content.';
    if (error instanceof Error) {
      errorMessage += ` Details: ${error.message}`;
    }
    yield `<div class="p-4 text-red-700 bg-red-100 rounded-lg">
      <p class="font-bold text-lg">Error Generating Content</p>
      <p class="mt-2">${errorMessage}</p>
    </div>`;
  }
}
