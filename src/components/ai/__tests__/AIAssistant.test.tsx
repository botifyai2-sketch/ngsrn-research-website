import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import AIAssistant from '../AIAssistant'

expect.extend(toHaveNoViolations)

// Mock the AI assistant hook
jest.mock('@/hooks/useAIAssistant', () => ({
  useAIAssistant: () => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: jest.fn(),
    clearMessages: jest.fn(),
  }),
}))

const mockProps = {
  articleId: 'test-article-1',
  articleContent: 'This is test article content for AI analysis.',
}

describe('AIAssistant Component', () => {
  const user = userEvent.setup()

  it('renders the AI assistant interface', () => {
    render(<AIAssistant {...mockProps} />)
    
    expect(screen.getByText('AI Research Assistant')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ask a question about this article...')).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(<AIAssistant {...mockProps} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeInTheDocument()
  })

  it('handles message input', async () => {
    render(<AIAssistant {...mockProps} />)
    
    const messageInput = screen.getByPlaceholderText('Ask a question about this article...')
    
    await user.type(messageInput, 'What is this article about?')
    
    expect(messageInput).toHaveValue('What is this article about?')
  })

  it('sends message on button click', async () => {
    const mockSendMessage = jest.fn()
    
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: [],
        isLoading: false,
        error: null,
        sendMessage: mockSendMessage,
        clearMessages: jest.fn(),
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    const messageInput = screen.getByPlaceholderText('Ask a question about this article...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(messageInput, 'Test question')
    await user.click(sendButton)
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test question')
  })

  it('sends message on Enter key', async () => {
    const mockSendMessage = jest.fn()
    
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: [],
        isLoading: false,
        error: null,
        sendMessage: mockSendMessage,
        clearMessages: jest.fn(),
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    const messageInput = screen.getByPlaceholderText('Ask a question about this article...')
    
    await user.type(messageInput, 'Test question')
    await user.keyboard('{Enter}')
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test question')
  })

  it('displays loading state', () => {
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: [],
        isLoading: true,
        error: null,
        sendMessage: jest.fn(),
        clearMessages: jest.fn(),
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument()
  })

  it('displays error state', () => {
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: [],
        isLoading: false,
        error: 'Failed to connect to AI service',
        sendMessage: jest.fn(),
        clearMessages: jest.fn(),
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    expect(screen.getByText('Failed to connect to AI service')).toBeInTheDocument()
  })

  it('displays conversation messages', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user' as const,
        content: 'What is this article about?',
        timestamp: new Date(),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'This article discusses sustainable research methodologies.',
        timestamp: new Date(),
      },
    ]
    
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: mockMessages,
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        clearMessages: jest.fn(),
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    expect(screen.getByText('What is this article about?')).toBeInTheDocument()
    expect(screen.getByText('This article discusses sustainable research methodologies.')).toBeInTheDocument()
  })

  it('has clear conversation button', () => {
    render(<AIAssistant {...mockProps} />)
    
    const clearButton = screen.getByRole('button', { name: /clear conversation/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('clears conversation when clear button is clicked', async () => {
    const mockClearMessages = jest.fn()
    
    jest.doMock('@/hooks/useAIAssistant', () => ({
      useAIAssistant: () => ({
        messages: [],
        isLoading: false,
        error: null,
        sendMessage: jest.fn(),
        clearMessages: mockClearMessages,
      }),
    }))
    
    render(<AIAssistant {...mockProps} />)
    
    const clearButton = screen.getByRole('button', { name: /clear conversation/i })
    await user.click(clearButton)
    
    expect(mockClearMessages).toHaveBeenCalled()
  })

  it('should not have accessibility violations', async () => {
    const { container } = render(<AIAssistant {...mockProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has proper ARIA labels and roles', () => {
    render(<AIAssistant {...mockProps} />)
    
    const chatContainer = screen.getByRole('log')
    expect(chatContainer).toHaveAttribute('aria-label', 'AI Assistant Conversation')
    
    const messageInput = screen.getByPlaceholderText('Ask a question about this article...')
    expect(messageInput).toHaveAttribute('aria-label', 'Message input')
  })

  it('disables send button when input is empty', () => {
    render(<AIAssistant {...mockProps} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('enables send button when input has content', async () => {
    render(<AIAssistant {...mockProps} />)
    
    const messageInput = screen.getByPlaceholderText('Ask a question about this article...')
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    await user.type(messageInput, 'Test question')
    
    expect(sendButton).toBeEnabled()
  })
})