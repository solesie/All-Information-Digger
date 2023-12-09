import { Answer } from '../messaging'

export type Event =
  | {
      type: 'answer'
      data: Answer
    }
  | {
      type: 'done'
    }

export interface GenerateAnswerParams {
  prompt: string
  searchItems: any[]
  onEvent: (event: Event) => void
  signal?: AbortSignal
}

export interface Provider {
  generateAnswer(params: GenerateAnswerParams): Promise<{ cleanup?: () => void }>
}
