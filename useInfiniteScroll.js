import { useState, useEffect, useRef, useCallback } from 'react';

const useInfiniteScroll = (fetchFn, language, resetKey = '') => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const observer = useRef(null);
  const requestId = useRef(0);
  const activeKey = useRef(`${language}:${resetKey}`);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    const nextKey = `${language}:${resetKey}`;
    const keyChanged = activeKey.current !== nextKey;

    if (keyChanged) {
      activeKey.current = nextKey;
      requestId.current += 1;
      setItems([]);
      setHasMore(true);
      setError(null);
      setLoading(false);
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    if (!keyChanged && !hasMore) return;

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    fetchFnRef.current(page, language)
      .then((res) => {
        if (currentRequest !== requestId.current) return;
        const results = res.data?.results || [];
        setItems((prev) => (page === 1 ? results : [...prev, ...results]));
        setHasMore(page < (res.data?.total_pages || 1) && page < 20);
        setLoading(false);
      })
      .catch((err) => {
        if (currentRequest !== requestId.current) return;
        setError(err.message || 'Something went wrong');
        setLoading(false);
      });
  }, [page, language, resetKey, hasMore]);

  const lastItemRef = useCallback((node) => {
    if (observer.current) observer.current.disconnect();
    if (!node || loading || !hasMore || typeof IntersectionObserver === 'undefined') return;

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setPage((prev) => prev + 1);
    });
    observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => () => {
    requestId.current += 1;
    if (observer.current) observer.current.disconnect();
  }, []);

  return { items, loading, error, hasMore, lastItemRef };
};

export default useInfiniteScroll;
