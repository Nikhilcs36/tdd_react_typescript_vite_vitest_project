import { Component } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import tw from "twin.macro";
import { DjangoPaginationProps } from "../types/djangoPagination";

const ButtonGroup = tw.div`flex justify-center mt-4 gap-2`;
const Button = tw.button`w-20 px-4 py-2 bg-blue-600 text-white flex justify-center items-center rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed`;
const PageInfo = tw.span`mx-2 flex items-center text-gray-600 dark:text-dark-text`;

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
