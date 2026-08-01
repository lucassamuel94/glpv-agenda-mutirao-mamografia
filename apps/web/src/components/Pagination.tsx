import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { PaginationState } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  pagination: PaginationState;
  alwaysVisible?: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  /** Classes extras mescladas (Tailwind-safe via `cn`) na div raiz — ex.: ajustar
   *  margem/borda quando embutido em modal/footer. */
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  pagination,
  isLoading = false,
  alwaysVisible = false,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}) => {
  const {
    total: totalItems,
    limit: itemsPerPage,
    page: currentPage,
    totalPages,
  } = pagination;

  if (isLoading) return null;
  if (totalPages <= 1 && !alwaysVisible) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Logic to generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5; // How many page numbers to show max (excluding first/last)

    if (totalPages <= 7) {
      // If few pages, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of dynamic window
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust window if close to beginning or end
      if (currentPage <= 3) {
        endPage = 4;
      }
      if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }

      // Add ellipsis before window
      if (startPage > 2) {
        pages.push("...");
      }

      // Add window pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis after window
      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card gap-4 mt-6",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <div className="hidden text-sm text-muted-foreground sm:block">
          Mostrando <span className="font-bold">{startItem}</span> a{" "}
          <span className="font-bold">{endItem}</span> de{" "}
          <span className="font-bold">{totalItems}</span> resultados
        </div>
        {onPageSizeChange && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden md:inline">Itens por página</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger
                className="h-8 w-[76px] bg-background px-2 text-xs"
                aria-label="Itens por página"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pageSizeOptions.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* First Page */}
        <Button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="icon-sm"
          aria-label="Primeira página"
          className="hidden sm:inline-flex"
        >
          <ChevronsLeft size={16} />
        </Button>

        {/* Previous Page */}
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="icon-sm"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </Button>

        {/* Page Numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-sm text-muted-foreground dark:text-muted-foreground font-medium">
                  ...
                </span>
              ) : (
                <Button
                  onClick={() => handlePageChange(page as number)}
                  variant={currentPage === page ? "primary" : "secondary"}
                  size="sm"
                  className={`min-w-[36px] ${
                    currentPage === page ? "z-10" : ""
                  }`}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile Page Indicator (Simple) */}
        <span className="sm:hidden text-sm font-medium text-muted-foreground px-2 whitespace-nowrap">
          Página {currentPage} de {totalPages}
        </span>

        {/* Next Page */}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="secondary"
          size="icon-sm"
          aria-label="Próxima página"
        >
          <ChevronRight size={16} />
        </Button>

        {/* Last Page */}
        <Button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          variant="secondary"
          size="icon-sm"
          aria-label="Última página"
          className="hidden sm:inline-flex"
        >
          <ChevronsRight size={16} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
