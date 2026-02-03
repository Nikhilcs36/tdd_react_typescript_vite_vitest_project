import { Component } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import tw from "twin.macro";
import { DjangoPaginationProps } from "../types/djangoPagination";

const ButtonGroup = tw.div`flex justify-center items-center mt-6 gap-3`;
const Button = tw.button`px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 min-w-[100px] justify-center`;
const PageInfo = tw.span`mx-4 px-3 py-2 bg-gray-100 dark:bg-dark-accent text-gray-700 dark:text-dark-text rounded-md font-medium text-sm`;

export interface PaginationProps extends WithTranslation, DjangoPaginationProps {}

/**
 * Pagination component for handling Django-style pagination
 * Uses next/previous URLs from Django REST Framework response
 * Note: Django doesn't expose total pages, so we calculate it from count and pageSize
 */
class Pagination extends Component<PaginationProps> {
  get totalPages(): number {
    const { count, pageSize } = this.props;
    return Math.ceil(count / pageSize);
  }

  handlePrevPage = () => {
    if (!this.props.loading && this.props.previous) {
      this.props.onPageChange(this.props.currentPage - 1);
    }
  };

  handleNextPage = () => {
    if (!this.props.loading && this.props.next) {
      this.props.onPageChange(this.props.currentPage + 1);
    }
  };

  render() {
    const { t, currentPage, count, loading } = this.props;
    const totalPages = this.totalPages;

    return (
      <ButtonGroup>
        <Button
          data-testid="prev-button"
          onClick={this.handlePrevPage}
          disabled={!this.props.previous || loading}
        >
          {t("userlist.buttonPrevious")}
        </Button>
        
        <PageInfo data-testid="page-info">
          {t("userlist.pageInfo", {
            current: currentPage,
            total: totalPages,
            count: count,
          })}
        </PageInfo>

        <Button
          data-testid="next-button"
          onClick={this.handleNextPage}
          disabled={!this.props.next || loading}
        >
          {t("userlist.buttonNext")}
        </Button>
      </ButtonGroup>
    );
  }
}

export default withTranslation()(Pagination);
