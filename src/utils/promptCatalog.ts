import { PromptTemplate, ReferenceCategory } from '../types';
import {
  INITIAL_PROMPT_CATALOG,
  loadPromptCatalog,
  savePromptCatalog,
  resetPromptCatalog,
} from '../data/prompts';

export const PROMPT_CATALOG: PromptTemplate[] = INITIAL_PROMPT_CATALOG;

export function getPromptForCategory(category: ReferenceCategory): string {
  const current = loadPromptCatalog();
  const match = current.find((p) => p.category === category);
  return match ? match.prompt : current[0].prompt;
}

export { loadPromptCatalog, savePromptCatalog, resetPromptCatalog };
