import { render, fireEvent, screen } from '@testing-library/react';
import { DetailsModal } from './DetailsModal';
import { ActivityNotification, TargetInfo } from '../api/types';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DetailsModal', () => {
    const mockOnClose = vi.fn();
    const mockActivity: ActivityNotification = {
        id: 1,
        diaryNumber: 'DN-2023-001',
        companyName: 'Test Company',
        companyId: '1234567-8',
        termId: 1,
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


describe('DetailsModal keyboard boundary', () => {
    it('names the dialog, moves focus inside, traps both Tab directions and restores focus', () => {
        const opener = document.createElement('button');
        document.body.append(opener);
        opener.focus();
        const { unmount } = render(<DetailsModal activity={{ id: 9, diaryNumber: '', companyName: 'Keyboard test', companyId: '', termId: 1, reportingStartDate: '2026-01-01', reportingEndDate: '2026-06-30', activityAmount: 'none', topics: [] }} onClose={() => {}} targetMap={new Map()} />);
        const dialog = screen.getByRole('dialog', { name: 'Keyboard test' });
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        const close = screen.getByRole('button', { name: 'Sulje tiedot' });
        expect(close).toHaveFocus();
        for (const shiftKey of [false, true]) {
            const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
            close.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
            expect(close).toHaveFocus();
        }
        unmount();
        expect(opener).toHaveFocus();
        opener.remove();
    });
});
