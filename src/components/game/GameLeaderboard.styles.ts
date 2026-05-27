import tw from 'twin.macro';
import styled from 'styled-components';

// Smooth expand/collapse animation — prevents flicker from content appearing/disappearing instantly
export const LeaderboardContent = styled.div<{ $isOpen: boolean }>`
  overflow: hidden;
  transition: all 0.3s ease-in-out;
  max-height: ${({ $isOpen }) => ($isOpen ? '2000px' : '0')};
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  visibility: ${({ $isOpen }) => ($isOpen ? 'visible' : 'hidden')};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'auto' : 'none')};
  ${({ $isOpen }) => $isOpen && `
    border-top: 1px solid #e5e7eb;
    margin-top: 1rem;
    padding-top: 1rem;
  `}
  html.dark & {
    ${({ $isOpen }) => $isOpen && `
      border-color: #374151;
    `}
  }
`;

export const LeaderboardButton = tw.button`
  text-sm
  font-semibold
  text-blue-500
  hover:text-blue-600
  dark:text-blue-400
  dark:hover:text-blue-300
  mb-4
  transition-colors
  duration-200
  mt-6
`;

// A scrollable wrapper that allows the table to remain semantic (display: table)
// while providing overflow scrolling. The thead sticks to the top of this wrapper.
// Horizontal overflow as a safety fallback on very small screens.
export const LeaderboardScrollWrapper = styled.div`
  overflow-y: auto;
  overflow-x: auto;
  max-height: 300px;
  display: block;
  -webkit-overflow-scrolling: touch;
`;

// The table uses table-layout: fixed to keep th and td columns aligned.
// display: table (default) ensures the thead and tbody share the same column widths.
// Column widths adapt via JS — Rank 20%, Username 50%, Score 30% on mobile.
export const LeaderboardTable = styled.table`
  width: 100%;
  text-align: left;
  table-layout: fixed;
`;

export const LeaderboardHeader = tw.th`
  px-2
  sm:px-4
  py-3
  font-semibold
  text-gray-700
  dark:text-gray-300
  border-b
  border-gray-200
  dark:border-gray-700
  bg-white
  dark:bg-dark-secondary
  text-xs
  sm:text-sm
`;

export const LeaderboardRow = tw.tr`
  border-b
  border-gray-100
  dark:border-gray-800
  hover:bg-gray-50
  dark:hover:bg-gray-800/50
  transition-colors
  duration-150
`;

export const LeaderboardCell = tw.td`
  px-2
  sm:px-4
  py-2
  text-gray-600
  dark:text-gray-400
  text-xs
  sm:text-sm
  whitespace-nowrap
  overflow-hidden
  text-ellipsis
`;

export const LeaderboardEmpty = tw.div`
  text-center
  py-4
  text-gray-500
  dark:text-gray-500
  text-sm
`;

export const LeaderboardError = tw.div`
  text-center
  py-4
  text-red-500
  dark:text-red-400
  text-sm
`;

export const LoadingRow = tw.tr``;

export const LoadingCell = tw.td`
  px-2
  sm:px-4
  py-4
  text-center
  text-gray-400
  dark:text-gray-500
`;

export const LeaderboardFooter = tw.div`
  flex
  justify-center
  mt-3
`;

export const LeaderboardLoadMoreButton = tw.button`
  px-4
  py-2
  text-sm
  font-medium
  text-blue-600
  dark:text-blue-400
  bg-transparent
  border
  border-blue-300
  dark:border-blue-600
  rounded
  hover:bg-blue-50
  dark:hover:bg-blue-900/30
  disabled:opacity-50
  disabled:cursor-not-allowed
  transition-colors
  duration-150
  w-full
  sm:w-auto
`;