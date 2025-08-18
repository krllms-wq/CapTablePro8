// Snapshot tests for empty state components
import { render } from '@testing-library/react';
import { 
  StakeholdersEmptyState, 
  TransactionsEmptyState, 
  ScenariosEmptyState,
  CompaniesEmptyState,
  EquityAwardsEmptyState 
} from '@/components/ui/empty-state';

describe('Empty State Components', () => {
  test('StakeholdersEmptyState renders correctly', () => {
    const mockHandler = jest.fn();
    const { container } = render(
      <StakeholdersEmptyState onAddStakeholder={mockHandler} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('TransactionsEmptyState renders correctly', () => {
    const mockHandler = jest.fn();
    const { container } = render(
      <TransactionsEmptyState onAddTransaction={mockHandler} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('ScenariosEmptyState renders correctly', () => {
    const mockHandler = jest.fn();
    const { container } = render(
      <ScenariosEmptyState onCreateScenario={mockHandler} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('CompaniesEmptyState renders correctly', () => {
    const mockHandler = jest.fn();
    const { container } = render(
      <CompaniesEmptyState onCreateCompany={mockHandler} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('EquityAwardsEmptyState renders correctly', () => {
    const mockHandler = jest.fn();
    const { container } = render(
      <EquityAwardsEmptyState onAddAward={mockHandler} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('empty state content matches expectations', () => {
    const mockHandler = jest.fn();
    const { getByTestId, getByText } = render(
      <StakeholdersEmptyState onAddStakeholder={mockHandler} />
    );
    
    expect(getByTestId('stakeholders-empty-state')).toBeInTheDocument();
    expect(getByText('No stakeholders yet')).toBeInTheDocument();
    expect(getByText('Add First Stakeholder')).toBeInTheDocument();
    expect(getByText('View Sample Data')).toBeInTheDocument();
  });
});