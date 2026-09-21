import { useState, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapApp } from '@capacitor/app';
import { useTheme } from './hooks/useTheme';
import LibraryEmpty from './components/LibraryEmpty';
import LibraryList from './components/LibraryList';
import AddArticleSheet from './components/AddArticleSheet';
import ReaderView from './components/ReaderView';
import SettingsSheet from './components/SettingsSheet';
import SplashScreen from './components/SplashScreen';
import { WELCOME_ARTICLE } from './data/welcomeArticle';
import { fetchAndParseArticle } from './utils/fetcher';
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
  const [readerStack, setReaderStack] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFetchingLink, setIsFetchingLink] = useState(false);

  const currentArticle = readerStack[readerStack.length - 1];

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
    setReaderStack([article]);
    setView('reader');
    window.scrollTo(0, 0);
  };

  const handleBack = useCallback(() => {
    if (readerStack.length > 1) {
      setReaderStack(prev => prev.slice(0, -1));
      window.scrollTo(0, 0);
    } else {
      log.info(Category.NAV, 'Navigating back to library');
      setView('library');
      setTimeout(() => setReaderStack([]), 300);
    }
  }, [readerStack]);

  const handleDeleteArticle = (id) => {
    log.info(Category.APP, 'Article deleted', { id });
    persistArticles(articles.filter(a => a.id !== id));
  };

  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    log.info(Category.APP, 'Splash complete, library visible');
  }, []);

  const handleLinkClick = async (url) => {
    setIsFetchingLink(true);
    try {
      const article = await fetchAndParseArticle(url);
      setReaderStack(prev => [...prev, { ...article, id: Date.now().toString(), isTemporary: true }]);
      window.scrollTo(0, 0);
    } catch (err) {
      alert("Could not load link: " + err.message);
    } finally {
      setIsFetchingLink(false);
    }
  };

  const handleSaveCurrent = () => {
    if (!currentArticle) return;
    const newArticle = { ...currentArticle, isTemporary: false, addedAt: new Date().toISOString() };
    persistArticles([newArticle, ...articles]);
    
    setReaderStack(prev => {
        const newStack = [...prev];
        newStack[newStack.length - 1] = newArticle;
        return newStack;
    });
  };

  const themeProps = { themeMode, resolvedTheme, setThemeMode, themeSubtext };

  useEffect(() => {
    const handleBackButton = () => {
      if (sheetOpen) {
        setSheetOpen(false);
        return;
      }
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (view === 'reader') {
        handleBack();
        return;
      }
      CapApp.exitApp();
    };

    const listener = CapApp.addListener('backButton', handleBackButton);

    return () => {
      listener.then(l => l.remove());
    };
  }, [view, sheetOpen, settingsOpen, handleBack]);

  const isCurrentSaved = currentArticle && articles.some(a => a.id === currentArticle.id) && !currentArticle.isTemporary;

  return (
    <div className="app-shell">
      <AnimatePresence>
        {showSplash && (
          <SplashScreen key="splash" onDone={handleSplashDone} />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'library' && (
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

        {view === 'reader' && currentArticle && (
          <motion.div
            key="reader"
            initial="initial" animate="in" exit="out"
            variants={pageVariants} transition={pageTransition}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <ReaderView
              article={currentArticle}
              onBack={handleBack}
              isSaved={isCurrentSaved}
              onSave={handleSaveCurrent}
              onLinkClick={handleLinkClick}
              isFetchingLink={isFetchingLink}
              {...themeProps}
            />
          </motion.div>
        )}

      </AnimatePresence>

      <SettingsSheet
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        {...themeProps}
      />
    </div>
  );
}
