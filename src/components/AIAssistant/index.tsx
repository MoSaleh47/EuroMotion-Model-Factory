/**
 * AI Assistant Component
 * 
 * Chat interface for interacting with the Mistral AI to modify model parameters.
 */

import React, { useState, useEffect, useRef } from 'react';
import { mistralService } from '../../ai/MistralService';
import type { AIResponse, ChatMessage } from '../../ai/MistralService';
import type { ModelConfig, SimulationResults } from '../../engine/types';

interface AIAssistantProps {
    config: ModelConfig;
    results: SimulationResults | null;
    onApplyChanges: (changes: AIResponse['changes']) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
    config,
    results,
    onApplyChanges,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [proxyStatus, setProxyStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check proxy server status on mount
    useEffect(() => {
        const checkProxy = async () => {
            const health = await mistralService.checkHealth();
            setProxyStatus(health.status === 'ok' && health.hasApiKey ? 'connected' : 'error');
        };
        checkProxy();
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await mistralService.chat(
                userMessage.content,
                config,
                results || undefined
            );

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: response.explanation,
                response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleApplyChanges = (changes: AIResponse['changes']) => {
        if (changes) {
            onApplyChanges(changes);
        }
    };

    const renderProxyStatus = () => {
        if (proxyStatus === 'checking') {
            return (
                <div style={{
                    padding: '12px',
                    background: '#fef3cd',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <span style={{ animation: 'pulse 1.5s infinite' }}>⏳</span>
                    Checking AI server connection...
                </div>
            );
        }

        if (proxyStatus === 'error') {
            return (
                <div style={{
                    padding: '12px',
                    background: '#f8d7da',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    border: '1px solid #f5c6cb',
                }}>
                    <strong>⚠️ AI Server Not Connected</strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                        To use the AI assistant:
                    </p>
                    <ol style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px' }}>
                        <li>Add your Mistral API key to the <code>.env</code> file</li>
                        <li>Run the proxy server: <code>node server/api-proxy.js</code></li>
                    </ol>
                </div>
            );
        }

        return (
            <div style={{
                padding: '12px',
                background: '#d4edda',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #c3e6cb',
            }}>
                ✅ AI Assistant Connected
            </div>
        );
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            maxHeight: 'calc(100vh - 200px)',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: '1px solid #e2e8f0',
                background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                color: 'white',
            }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                    🤖 AI Assistant
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                    Ask me to analyze or modify the simulation model
                </p>
            </div>

            {/* Status */}
            <div style={{ padding: '16px 20px 0 20px' }}>
                {renderProxyStatus()}
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
            }}>
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#64748b',
                        padding: '40px 20px',
                    }}>
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>💬</p>
                        <p style={{ fontWeight: '600', marginBottom: '8px' }}>
                            Start a conversation
                        </p>
                        <p style={{ fontSize: '14px' }}>
                            Ask questions like:
                        </p>
                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: '16px 0 0 0',
                            fontSize: '14px',
                        }}>
                            <li style={{ margin: '8px 0', padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}>
                                "How can I improve resilience to chip shortages?"
                            </li>
                            <li style={{ margin: '8px 0', padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}>
                                "Create a scenario with a battery supply crisis"
                            </li>
                            <li style={{ margin: '8px 0', padding: '8px 16px', background: '#f1f5f9', borderRadius: '8px' }}>
                                "Analyze my current simulation results"
                            </li>
                        </ul>
                    </div>
                )}

                {messages.map((message, index) => (
                    <MessageBubble
                        key={index}
                        message={message}
                        onApplyChanges={handleApplyChanges}
                    />
                ))}

                {isLoading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '16px',
                        color: '#64748b',
                    }}>
                        <div className="animate-pulse">🤔</div>
                        Thinking...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '16px 20px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
            }}>
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-end',
                }}>
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about the model..."
                        disabled={proxyStatus !== 'connected' || isLoading}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            resize: 'none',
                            minHeight: '44px',
                            maxHeight: '120px',
                            fontFamily: 'inherit',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                        }}
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || proxyStatus !== 'connected' || isLoading}
                        style={{
                            padding: '12px 24px',
                            background: inputValue.trim() && proxyStatus === 'connected' && !isLoading
                                ? 'linear-gradient(to right, #6366f1, #8b5cf6)'
                                : '#e2e8f0',
                            color: inputValue.trim() && proxyStatus === 'connected' && !isLoading
                                ? 'white'
                                : '#94a3b8',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: inputValue.trim() && proxyStatus === 'connected' && !isLoading
                                ? 'pointer'
                                : 'not-allowed',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

interface MessageBubbleProps {
    message: ChatMessage;
    onApplyChanges: (changes: AIResponse['changes']) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onApplyChanges }) => {
    const isUser = message.role === 'user';
    const [applied, setApplied] = useState(false);

    const handleApply = () => {
        if (message.response?.changes) {
            onApplyChanges(message.response.changes);
            setApplied(true);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
            marginBottom: '16px',
        }}>
            <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser
                    ? 'linear-gradient(to right, #6366f1, #8b5cf6)'
                    : '#f1f5f9',
                color: isUser ? 'white' : '#1e293b',
            }}>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
            </div>

            {/* AI Response Details */}
            {!isUser && message.response && (
                <div style={{
                    maxWidth: '85%',
                    marginTop: '8px',
                }}>
                    {/* Confidence indicator */}
                    {message.response.confidence > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px',
                            fontSize: '13px',
                            color: '#64748b',
                        }}>
                            <span>Confidence:</span>
                            <div style={{
                                width: '100px',
                                height: '6px',
                                background: '#e2e8f0',
                                borderRadius: '3px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${message.response.confidence * 100}%`,
                                    height: '100%',
                                    background: message.response.confidence > 0.7 ? '#22c55e' :
                                        message.response.confidence > 0.4 ? '#f59e0b' : '#ef4444',
                                    borderRadius: '3px',
                                }} />
                            </div>
                            <span>{(message.response.confidence * 100).toFixed(0)}%</span>
                        </div>
                    )}

                    {/* Suggested Changes */}
                    {message.response.changes && (
                        <div style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '8px',
                        }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                fontSize: '14px',
                                color: '#065f46',
                            }}>
                                📝 Suggested Changes
                            </h4>

                            {message.response.changes.parameters && (
                                <div style={{ marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '13px' }}>Parameters:</strong>
                                    <ul style={{
                                        margin: '4px 0',
                                        paddingLeft: '20px',
                                        fontSize: '13px',
                                    }}>
                                        {Object.entries(message.response.changes.parameters).map(([key, value]) => (
                                            <li key={key}>
                                                <code>{key}</code>: {value}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {message.response.changes.scenario && (
                                <div>
                                    <strong style={{ fontSize: '13px' }}>New Scenario:</strong>
                                    <p style={{ fontSize: '13px', margin: '4px 0' }}>
                                        {message.response.changes.scenario.description}
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleApply}
                                disabled={applied}
                                style={{
                                    marginTop: '8px',
                                    padding: '8px 16px',
                                    background: applied ? '#94a3b8' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: applied ? 'default' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                }}
                            >
                                {applied ? '✓ Applied' : 'Apply Changes'}
                            </button>
                        </div>
                    )}

                    {/* Reasoning */}
                    {message.response.reasoning && (
                        <details style={{ fontSize: '13px', color: '#64748b' }}>
                            <summary style={{ cursor: 'pointer' }}>Show reasoning</summary>
                            <p style={{ margin: '8px 0' }}>{message.response.reasoning}</p>
                        </details>
                    )}
                </div>
            )}

            <span style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '4px',
            }}>
                {message.timestamp.toLocaleTimeString()}
            </span>
        </div>
    );
};

export default AIAssistant;
