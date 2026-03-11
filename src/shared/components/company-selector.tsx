// =====================================================
// COMPANY SELECTOR COMPONENT - Dropdown for company selection
// =====================================================

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import { useCompanyStore } from '../lib/stores';
import { useTranslation } from '../lib/language-context';
import type { Company } from '../types';

export function CompanySelector() {
  const t = useTranslation();
  const { 
    selectedCompany, 
    companies, 
    setSelectedCompany, 
    setCompanies,
    isLoading,
    setLoading,
    error,
    setError,
    _hasHydrated,
  } = useCompanyStore();
  
  const [mounted, setMounted] = useState(false);
  const hasAutoSelected = useRef(false);
  const hasFetchedCompanies = useRef(false);

  // Fetch companies on mount
  useEffect(() => {
    setMounted(true);
    
    // Don't fetch if already fetched
    if (hasFetchedCompanies.current) return;
    
    const fetchCompanies = async () => {
      hasFetchedCompanies.current = true;
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          setCompanies(data.data);
        } else {
          setError(data.error || 'Failed to fetch companies');
        }
      } catch (err) {
        setError('Failed to fetch companies');
        console.error('Error fetching companies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [setCompanies, setLoading, setError]);

  // Auto-select logic - only after hydration is complete
  useEffect(() => {
    // Wait for hydration to complete
    if (!_hasHydrated) return;
    
    // Only auto-select once
    if (hasAutoSelected.current) return;
    
    // Only auto-select if no company is selected and we have companies
    if (!selectedCompany && companies.length > 0) {
      hasAutoSelected.current = true;
      setSelectedCompany(companies[0]);
    }
  }, [_hasHydrated, selectedCompany, companies, setSelectedCompany]);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c: Company) => c.companyId.toString() === companyId);
    if (company) {
      setSelectedCompany(company);
    }
  };

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <div className="h-9 w-[180px] sm:w-[220px] animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isLoading && companies.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || companies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select
        value={selectedCompany?.companyId.toString() || ''}
        onValueChange={handleCompanyChange}
      >
        <SelectTrigger className="w-[180px] sm:w-[220px] h-9 text-sm">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company: Company) => (
            <SelectItem
              key={company.companyId}
              value={company.companyId.toString()}
              className="text-sm"
            >
              <div className="flex flex-col">
                <span className="font-medium">{company.companyName}</span>
                <span className="text-xs text-muted-foreground">
                  {company.erpCode} | FY: {company.financialYear}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
