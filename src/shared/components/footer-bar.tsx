// =====================================================
// PROFESSIONAL FOOTER BAR - With pagination and stats
// =====================================================

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterBarProps {
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  
  // Optional features
  showPageSize?: boolean;
  className?: string;
}

export function FooterBar({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  className,
}: FooterBarProps) {
  // Generate page numbers to display (show limited pages for clean UI)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 3;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className={cn(
      "sticky bottom-0 z-40 bg-background/95 backdrop-blur-sm border-t",
      className
    )}>
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Left: Item count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          <Package className="h-4 w-4" />
          <span className="hidden sm:inline">
            {startIndex} - {endIndex} of {totalItems}
          </span>
          <span className="sm:hidden">
            {startIndex}-{endIndex} / {totalItems}
          </span>
        </div>

        {/* Center: Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hidden sm:flex"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            
            {/* Previous */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-0.5">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === 'ellipsis' ? (
                    <span className="px-1.5 text-xs text-muted-foreground">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "ghost"}
                      size="icon"
                      className={cn(
                        "h-7 w-7 text-xs font-medium",
                        currentPage === page && "h-7 w-7"
                      )}
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Next */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            
            {/* Last page */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hidden sm:flex"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Right: Page jump & info */}
        <div className="flex items-center gap-2 shrink-0">
          {totalPages > 1 && (
            <>
              <span className="text-xs text-muted-foreground hidden md:inline">
                Page
              </span>
              <Input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                  }
                }}
                className="w-12 h-7 text-center text-xs px-1"
              />
              <span className="text-xs text-muted-foreground">
                / {totalPages}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile-optimized footer for cart
interface MobileCartFooterProps {
  totalItems: number;
  total: number;
  onClearCart: () => void;
  onViewCart: () => void;
  formatCurrency: (amount: number) => string;
}

export function MobileCartFooter({
  totalItems,
  total,
  onClearCart,
  onViewCart,
  formatCurrency,
}: MobileCartFooterProps) {
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-sm border-t shadow-lg">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">{totalItems}</span>
              <span className="text-xs text-muted-foreground">items</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="font-bold text-sm">{formatCurrency(total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-destructive hover:text-destructive"
              onClick={onClearCart}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={onViewCart}
            >
              View Cart
            </Button>
          </div>
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
    </div>
  );
}
