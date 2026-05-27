import React, { useState, useEffect } from 'react';
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
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

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
  // Read user directly from Redux for a stable boolean that only changes
  // when the actual is_staff/is_superuser values change — not when function references change.
  // This prevents the fetch effect from re-firing on parent re-renders.
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdminUser = user?.is_staff === true || user?.is_superuser === true;
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

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
            <LeaderboardScrollWrapper data-testid="leaderboard-scroll-body">
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
                      <LeaderboardCell style={COLUMN_WIDTHS[2]}>{Math.round(entry.score)}%</LeaderboardCell>
                      <LeaderboardCell style={COLUMN_WIDTHS[3]}>{new Date(entry.created_at).toLocaleDateString()}</LeaderboardCell>
                    </LeaderboardRow>
                  ))}
                </tbody>
              </LeaderboardTable>
            </LeaderboardScrollWrapper>
            {nextPageUrl && (
              <LeaderboardFooter>
                <LeaderboardLoadMoreButton
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  data-testid="leaderboard-load-more"
                >
                  {loadingMore ? t('game.leaderboard.loading') : t('game.leaderboard.loadMore')}
                </LeaderboardLoadMoreButton>
              </LeaderboardFooter>
            )}
          </>
        )}
      </LeaderboardContent>
    </>
  );
};

export default GameLeaderboard;