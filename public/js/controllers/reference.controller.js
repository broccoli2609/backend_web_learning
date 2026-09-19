/**
 * CONTROLLER — Bảng phiên bản thư viện và từ điển thuật ngữ.
 */
import { contentModel } from '../models/content.model.js';
import { libraryModel } from '../models/library.model.js';
import { renderLibraries, renderGlossary } from '../views/reference.view.js';
import { router } from './router.js';

export const libraryController = {
  render() {
    return {
      html: renderLibraries({
        updatedAt: libraryModel.updatedAt(),
        note: libraryModel.note(),
        itemsByEco: (eco) => libraryModel.byEcosystem(eco),
        sourceLabel: libraryModel.sourceLabel()
      })
    };
  }
};

let glossaryQuery = '';
let searchTimer = null;

export const glossaryController = {
  render() {
    return {
      html: renderGlossary({
        terms: contentModel.searchGlossary(glossaryQuery),
        total: contentModel.glossary().length,
        query: glossaryQuery
      })
    };
  },

  mount(root) {
    const search = root.querySelector('#gloss-q');
    if (!search) return;

    search.addEventListener('input', () => {
      glossaryQuery = search.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const caret = search.selectionStart;
        router.render();
        const again = document.querySelector('#gloss-q');
        if (again) {
          again.focus();
          try {
            again.setSelectionRange(caret, caret);
          } catch {
            /* bỏ qua */
          }
        }
      }, 220);
    });
  }
};
