import { render, fireEvent, screen } from '@testing-library/react';
import { DetailsModal } from './DetailsModal';
import { ActivityNotification, TargetInfo } from '../api/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DetailsModal', () => {
    const mockOnClose = vi.fn();
    const mockActivity: ActivityNotification = {
        id: 1,
        companyName: 'Test Company',
        companyId: '1234567-8',
        reportingStartDate: '2023-01-01',
        reportingEndDate: '2023-12-31',
        activityAmount: 'minimal',
        topics: [],
        description: 'Test description',
    };
    const mockTargetMap = new Map<number, TargetInfo>();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(
            <DetailsModal
                activity={mockActivity}
                onClose={mockOnClose}
                targetMap={mockTargetMap}
            />
        );
        expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    it('calls onClose when overlay is clicked', () => {
        render(
            <DetailsModal
                activity={mockActivity}
                onClose={mockOnClose}
                targetMap={mockTargetMap}
            />
        );
        fireEvent.click(document.querySelector('.modal-overlay')!);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when close button is clicked', () => {
        render(
            <DetailsModal
                activity={mockActivity}
                onClose={mockOnClose}
                targetMap={mockTargetMap}
            />
        );
        fireEvent.click(document.querySelector('.close-button')!);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when Escape key is pressed', () => {
        render(
            <DetailsModal
                activity={mockActivity}
                onClose={mockOnClose}
                targetMap={mockTargetMap}
            />
        );

        fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
        expect(mockOnClose).toHaveBeenCalled();
    });
});
