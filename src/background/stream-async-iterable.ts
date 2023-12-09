export async function* streamAsyncIterable(stream: ReadableStream) {
  const reader = stream.getReader()
  try {
    // while: 왜냐하면 데이터가 크면 한 번에 읽히지 않는다.
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        return
      }
      yield value
    }
  } finally {
    reader.releaseLock()
  }
}
