import { useState } from 'react'
import useSWRImmutable from 'swr/immutable'
import { fetchPromotion } from '../api'
import { TriggerMode } from '../config'
import ChatGPTCard from './ChatGPTCard'
import { QueryStatus } from './ChatGPTQuery'

interface Props {
  question: string
  searchItems: any[]
  triggerMode: TriggerMode
}

function ChatGPTContainer(props: Props) {
  const [queryStatus, setQueryStatus] = useState<QueryStatus>()
  const query = useSWRImmutable(
    queryStatus === 'success' ? 'promotion' : undefined,
    fetchPromotion,
    { shouldRetryOnError: false },
  )
  return (
    <>
      <div className="chat-gpt-card">
        <ChatGPTCard
          question={props.question}
          searchItems={props.searchItems}
          triggerMode={props.triggerMode}
          onStatusChange={setQueryStatus}
        />
      </div>
      {/* {query.data && <Promotion data={query.data} />} */}
    </>
  )
}

export default ChatGPTContainer
