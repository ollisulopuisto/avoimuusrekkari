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


describe('DetailsModal list identity', () => {
    it('keeps each topic and target attached to its own DOM node when reordered', () => {
        const activity: ActivityNotification = {
            id: 10, diaryNumber: '', companyName: 'List identity', companyId: '',
            termId: 1, reportingStartDate: '', reportingEndDate: '', activityAmount: 'none',
            topics: [1, 2].map(id => ({
                id, title: `Topic ${id}`, activityType: 'direct', contactTopicType: 'other',
                contactedTargets: [1, 2].map(targetId => ({
                    id: targetId, contactedTargetId: targetId, contactMethods: ['email'],
                })),
            })),
        };
        const targets = new Map<number, TargetInfo>([1, 2].map(id => [id, {
            id, name: `Target ${id}`, organization: `Org ${id}`, title: `Role ${id}`,
        }]));
        const close = () => {};
        const { rerender } = render(<DetailsModal activity={activity} onClose={close} targetMap={targets} />);
        const firstTopic = screen.getByText('Topic 1').closest('.topic-item');
        const firstTarget = firstTopic?.querySelector('.target-chip');
        expect(firstTarget).toHaveTextContent('Target 1, Role 1, Org 1');
        rerender(<DetailsModal activity={{ ...activity, topics: [...activity.topics!].reverse().map(
            topic => ({ ...topic, contactedTargets: [...topic.contactedTargets!].reverse() })
        ) }} onClose={close} targetMap={targets} />);
        expect(screen.getByText('Topic 1').closest('.topic-item')).toBe(firstTopic);
        expect(firstTopic?.querySelectorAll('.target-chip')[1]).toBe(firstTarget);
        expect(firstTarget).toHaveAttribute('title', 'email');
    });
});
