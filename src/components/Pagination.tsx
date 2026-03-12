import { Component } from "react";
import { withTranslation } from "react-i18next";
import { PaginationProps } from "./Pagination.types";
import { ButtonGroup, Button, PageInfo } from "./Pagination.styles";

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

const PaginationWithTranslation = withTranslation()(Pagination);
export default PaginationWithTranslation;
