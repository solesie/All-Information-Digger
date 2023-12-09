import Browser from 'webextension-polyfill'
import { getProviderConfigs, ProviderType } from '../config'
import { BARDProvider, sendMessageFeedbackBard } from './providers/bard'
import { ChatGPTProvider, getChatGPTAccessToken, sendMessageFeedback } from './providers/chatgpt'
import { ChatGPTPromptProvider } from './providers/chatgpt-prompt'
import { OpenAIProvider } from './providers/openai'
import { ConversationContext, Provider } from './types'

async function generateAnswers(
  port: Browser.Runtime.Port,
  providerType: ProviderType,
  question: string,
  searchItems: any[],
  conversationId: string | undefined,
  parentMessageId: string | undefined,
  conversationContext: ConversationContext | undefined,
) {
  let provider: Provider
  if (providerType === ProviderType.Bard) {
    provider = new BARDProvider()
  } else if (providerType === ProviderType.ChatGPT) {
    const token = await getChatGPTAccessToken()
    provider = new ChatGPTProvider(token)
  } else if (providerType === ProviderType.ChatGPTPrompt) {
    const token = await getChatGPTAccessToken()
    provider = new ChatGPTPromptProvider(token)
  } else if (providerType === ProviderType.GPT4) {
    const { apiKey, model } = providerConfigs.configs[ProviderType.GPT4]!
    provider = new OpenAIProvider(apiKey, model)
  } else {
    throw new Error(`Unknown provider ${providerType}`)
  }

  const controller = new AbortController()
  port.onDisconnect.addListener(() => {
    controller.abort()
    cleanup?.()
  })

  const { cleanup } = await provider.generateAnswer({
    prompt: question,
    signal: controller.signal,
    onEvent(event) {
      if (event.type === 'done') {
        port.postMessage({ event: 'DONE' })
        return
      }
      port.postMessage(event.data)
    },
    searchItems,
    conversationId: conversationId, //used for chatGPT
    parentMessageId: parentMessageId, //used for chatGPT
    conversationContext: conversationContext, //used for BARD
  })
}

Browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    console.debug('received msg', msg)
    try {
      await generateAnswers(
        port,
        msg.provider,
        msg.question,
        msg.searchItems,
        msg.conversationId,
        msg.parentMessageId,
        msg.conversationContext,
      )
    } catch (err: any) {
      console.error(err)
      port.postMessage({ error: err.message })
    }
  })
})

Browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === 'FEEDBACK') {
    const providerConfigs = await getProviderConfigs()
    if (providerConfigs.provider === ProviderType.ChatGPT) {
      const token = await getChatGPTAccessToken()
      await sendMessageFeedback(token, message.data)
    } else {
      await sendMessageFeedbackBard(message.data)
    }
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    Browser.runtime.openOptionsPage()
  } else if (message.type === 'GET_ACCESS_TOKEN') {
    return getChatGPTAccessToken()
  }
})

Browser.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    Browser.runtime.openOptionsPage()
  }
})
