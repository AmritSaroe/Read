import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from './hooks/useTheme';
import LibraryEmpty from './components/LibraryEmpty';
import LibraryList from './components/LibraryList';
import AddArticleSheet from './components/AddArticleSheet';
import ReaderView from './components/ReaderView';
import SettingsSheet from './components/SettingsSheet';
import SplashScreen from './components/SplashScreen';
import { WELCOME_ARTICLE } from './data/welcomeArticle';
import { log, Category } from './utils/logger';
import './index.css';

const pageVariants = {
  initial: { opacity: 0 },
  in:      { opacity: 1 },
  out:     { opacity: 0 },
};
const pageTransition = { duration: 0.18, ease: 'easeInOut' };

export default function App() {
  const { themeMode, resolvedTheme, setThemeMode, themeSubtext } = useTheme();

  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState('library');
  const [articles, setArticles] = useState(() => {
    const saved = localStorage.getItem('articles');
    if (saved) return JSON.parse(saved);
    const seeded = localStorage.getItem('seeded');
    if (!seeded) {
      localStorage.setItem('seeded', '1');
      const initial = [WELCOME_ARTICLE];
      localStorage.setItem('articles', JSON.stringify(initial));
      return initial;
    }
    return [];
  });
  const [currentArticle, setCurrentArticle] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const persistArticles = (updated) => {
    setArticles(updated);
    localStorage.setItem('articles', JSON.stringify(updated));
    log.debug(Category.STORAGE, 'Articles persisted', { count: updated.length });
  };

  const handleArticleAdded = (article) => {
    log.info(Category.APP, 'Article added to library', { title: article.title, id: article.id });
    persistArticles([article, ...articles]);
  };

  const handleOpenArticle = (article) => {
    log.info(Category.NAV, 'Navigating to reader', { articleId: article.id, title: article.title });
    setCurrentArticle(article);
    setView('reader');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    log.info(Category.NAV, 'Navigating back to library');
    setView('library');
    setTimeout(() => setCurrentArticle(null), 300);
  };

  const handleDeleteArticle = (id) => {
    log.info(Category.APP, 'Article deleted', { id });
    persistArticles(articles.filter(a => a.id !== id));
  };

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    log.info(Category.APP, 'Splash complete, library visible');
  }, []);

  const themeProps = { themeMode, resolvedTheme, setThemeMode, themeSubtext };

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onDone={handleSplashDone} />
        )}

        {!showSplash && view === 'library' && (
          <motion.div
            key="library"
            initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            {articles.length > 0 ? (
              <div className="screen-scroll">
                <LibraryList
                  articles={articles}
                  onOpen={handleOpenArticle}
                  onDelete={handleDeleteArticle}
                  onAdd={() => setSheetOpen(true)}
                  onSettings={() => setSettingsOpen(true)}
                  {...themeProps}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="top-bar">
                  <span className="top-bar-title">Library</span>
                </div>
                <div className="divider" />
                <LibraryEmpty onAdd={() => setSheetOpen(true)} />
              </div>
            )}

            <AddArticleSheet
              isOpen={sheetOpen}
              onClose={() => setSheetOpen(false)}
              onAdded={handleArticleAdded}
            />
          </motion.div>
        )}

        {!showSplash && view === 'reader' && currentArticle && (
          <motion.div
            key="reader"
            initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <ReaderView
              article={currentArticle}
              onBack={handleBack}
              {...themeProps}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* SettingsSheet rendered at App level — covers full app-shell */}
      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        {...themeProps}
      />
    </div>
  );
}
