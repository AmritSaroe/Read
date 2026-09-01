import { useState } from 'react';
import { IconPlus, IconLoader2 } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAndParseArticle } from '../utils/fetcher';

/**
 * AddArticleSheet — bottom sheet URL input
 *
 * Props:
 *   isOpen   boolean
 *   onClose  fn()
 *   onAdded  fn(article)
 */
export default function AddArticleSheet({ isOpen, onClose, onAdded }) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const article = await fetchAndParseArticle(url.trim());
      onAdded({
        ...article,
        id: Date.now().toString(),
        addedAt: new Date().toISOString(),
      });
      setUrl('');
      onClose();
    } catch (err) {
      setError(err.message || 'Could not fetch that article. Try another URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="sheet-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            <div className="sheet-handle" />
            <p className="sheet-title">Add article</p>

            <form onSubmit={handleSubmit}>
              <input
                type="url"
                className="input-field"
                placeholder="Paste article URL…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                required
              />
              {error && <p className="error-text">{error}</p>}
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isLoading}
              >
                {isLoading
                  ? <IconLoader2 size={16} strokeWidth={2} className="spin" />
                  : <IconPlus size={16} strokeWidth={2.5} />
                }
                {isLoading ? 'Fetching…' : 'Save article'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
