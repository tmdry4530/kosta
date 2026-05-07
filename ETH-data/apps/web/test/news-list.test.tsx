import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NewsList } from '../src/features/event-detail/NewsList'

describe('NewsList', () => {
  it('sanitizes crawler residue and raw markdown from news text', () => {
    render(
      <NewsList
        items={[
          {
            id: '1',
            source: 'coindesk',
            url: 'https://example.com/news',
            title: 'South Korea Must Reverse BanX iconX icon',
            summary: '*[Prices](https://example.com/prices) 더 보기*',
            publishedAt: null,
            language: 'en'
          }
        ]}
      />
    )

    expect(screen.getByText('South Korea Must Reverse Ban')).toBeInTheDocument()
    expect(screen.getByText('Prices 더 보기')).toBeInTheDocument()
    expect(screen.queryByText(/X icon/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\*\[Prices\]/)).not.toBeInTheDocument()
  })
})
