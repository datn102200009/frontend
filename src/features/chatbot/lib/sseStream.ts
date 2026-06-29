export async function* consumeSSE(response: Response) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';
    for (const evt of events) {
      if (!evt.trim()) continue;
      const lines = evt.split('\n');
      let eventName = 'message';
      let data = '';
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventName = line.slice(7).trim();
        } else if (line.startsWith('data: ')) {
          data += line.slice(6);
        }
      }
      if (data) {
        try {
          yield { event: eventName, data: JSON.parse(data) };
        } catch {
          // Bỏ qua lỗi parsing JSON với các dòng dữ liệu không hợp lệ
        }
      }
    }
  }
}
