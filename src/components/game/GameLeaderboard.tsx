import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LeaderboardButton,
  LeaderboardContent,
  LeaderboardScrollWrapper,
  LeaderboardTable,
  LeaderboardHeader,
  LeaderboardRow,
  LeaderboardCell,
  LeaderboardEmpty,
  LeaderboardError,
  LoadingCell,
  LeaderboardFooter,
  LeaderboardLoadMoreButton,
} from './GameLeaderboard.styles';
import { getGameLeaderboardPage } from '../../services/gameService';
import { LeaderboardEntry } from '../../types/game';
import { useUserAuthorization } from '../../utils/authorization';

const SCROLL_THRESHOLD = 5; // px from bottom to consider "at bottom"

const THEAD_STYLE: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const COLUMN_WIDTHS: React.CSSProperties[] = [
  { width: '15%' },   // Rank
  { width: '40%' },   // Username
  { width: '20%' },   // Score
  { width: '25%' },   // Last Played
];

const HEADERS = ['rank', 'username', 'score', 'lastPlayed'] as const;

const GameLeaderboard: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useUserAuthorization();
  const isAdminUser = isAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const checkIsAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(remaining < SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    if (!isOpen || !isAdminUser) return;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const page = await getGameLeaderboardPage();
        setEntries(page.results);
        setNextPageUrl(page.next);
      } catch {
        setError(t('game.leaderboard.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isOpen, isAdminUser, t]);

  // Check initial scroll position and listen for scroll events
  // Using both onScroll prop (for React/test compatibility) and addEventListener
  // (for native browser behavior) to ensure reliable detection everywhere
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !entries.length) return;

    checkIsAtBottom();
  }, [entries, checkIsAtBottom]);

  const handleLoadMore = async () => {
    if (!nextPageUrl || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await getGameLeaderboardPage(nextPageUrl);
      setEntries(prev => [...prev, ...page.results]);
      setNextPageUrl(page.next);
    } catch {
      setError(t('game.leaderboard.error'));
    } finally {
      setLoadingMore(false);
    }
  };

  if (!isAdminUser) return null;

  return (
    <>
      <LeaderboardButton
        onClick={() => setIsOpen(!isOpen)}
        data-testid="leaderboard-toggle"
      >
        {isOpen ? t('game.leaderboard.hide') : t('game.leaderboard.show')}
      </LeaderboardButton>

      <LeaderboardContent
        $isOpen={isOpen}
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' as const : 'none' as const,
        }}
      >
        {loading && (
          <LeaderboardScrollWrapper data-testid="leaderboard-scroll-body">
            <LeaderboardTable>
              <thead style={THEAD_STYLE}>
                <tr>
                  {HEADERS.map((header, i) => (
                    <LeaderboardHeader key={header} style={COLUMN_WIDTHS[i]}>
                      {t(`game.leaderboard.${header}`)}
                    </LeaderboardHeader>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <LoadingCell colSpan={4}>{t('game.loading')}</LoadingCell>
                </tr>
              </tbody>
            </LeaderboardTable>
          </LeaderboardScrollWrapper>
        )}

        {error && (
          <LeaderboardError data-testid="leaderboard-error">
            {error}
          </LeaderboardError>
        )}

        {!loading && !error && entries.length === 0 && (
          <LeaderboardEmpty data-testid="leaderboard-empty">
            {t('game.leaderboard.empty')}
          </LeaderboardEmpty>
        )}

        {!loading && !error && entries.length > 0 && (
          <>
            <LeaderboardScrollWrapper
              ref={scrollRef}
              onScroll={checkIsAtBottom}
              data-testid="leaderboard-scroll-body"
            >
              <LeaderboardTable data-testid="leaderboard-table">
                <thead style={THEAD_STYLE}>
                  <tr>
                    {HEADERS.map((header, i) => (
                      <LeaderboardHeader key={header} style={COLUMN_WIDTHS[i]}>
                        {t(`game.leaderboard.${header}`)}
                      </LeaderboardHeader>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <LeaderboardRow key={`${entry.username}-${index}`} data-testid={`leaderboard-row-${index}`}>
                      <LeaderboardCell style={COLUMN_WIDTHS[0]}>{index + 1}</LeaderboardCell>
                      <LeaderboardCell style={COLUMN_WIDTHS[1]}>{entry.username}</LeaderboardCell>
                      <LeaderboardCell style={COLUMN_WIDTHS[2]}>{entry.score.toFixed(1)}%</LeaderboardCell>
                      <LeaderboardCell style={COLUMN_WIDTHS[3]}>{new Date(entry.created_at).toLocaleDateString()}</LeaderboardCell>
                    </LeaderboardRow>
                  ))}
                </tbody>
              </LeaderboardTable>
            </LeaderboardScrollWrapper>
            {/* Always render LeaderboardFooter to reserve space and prevent
                bottom-edge shifting when toggling between pages / last page.
                The Load More button itself is visually hidden when not at the
                scroll bottom or when nextPageUrl is null (replaced by placeholder). */}
            <LeaderboardFooter>
              {nextPageUrl ? (
                <LeaderboardLoadMoreButton
                  onClick={handleLoadMore}
                  disabled={loadingMore || !isAtBottom}
                  data-testid="leaderboard-load-more"
                  style={{
                    visibility: isAtBottom ? 'visible' : 'hidden',
                    opacity: isAtBottom ? 1 : 0,
                    pointerEvents: isAtBottom ? 'auto' as const : 'none' as const,
                  }}
                >
                  {loadingMore ? t('game.leaderboard.loading') : t('game.leaderboard.loadMore')}
                </LeaderboardLoadMoreButton>
              ) : (
                <div style={{ height: '40px' }} />
              )}
            </LeaderboardFooter>
          </>
        )}
      </LeaderboardContent>
    </>
  );
};

export default GameLeaderboard;