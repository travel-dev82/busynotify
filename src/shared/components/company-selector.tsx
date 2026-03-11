// =====================================================
// COMPANY SELECTOR COMPONENT - Dropdown for company selection
// =====================================================

'use client';

import React, { useEffect, useState } from 'react';
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
    setError 
  } = useCompanyStore();
  
  const [mounted, setMounted] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    setMounted(true);
    
    const fetchCompanies = async () => {
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
          
          // Auto-select first company if none selected
          if (data.data.length > 0 && !selectedCompany) {
            setSelectedCompany(data.data[0]);
          }
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
  }, []);

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
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isLoading) {
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
