import { useState } from 'react';
import { MessageSquare, Search, Send, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback, useEffect } from 'react';
import type { WhatsAppChat, WhatsAppMessage, WhatsAppContact } from '@/types/crm';

function formatTime(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function WhatsAppCenterPage() {
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [contacts, setContacts] = useState<Map<string, WhatsAppContact>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchChats = useCallback(async () => {
    setLoading(true);
    const { data: chatsData } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('last_message_ts', { ascending: false })
      .limit(50);
    const { data: contactsData } = await supabase
      .from('whatsapp_contacts')
      .select('*');

    if (chatsData) setChats(chatsData as WhatsAppChat[]);
    if (contactsData) {
      const map = new Map<string, WhatsAppContact>();
      (contactsData as WhatsAppContact[]).forEach((c) => map.set(c.jid, c));
      setContacts(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const openChat = async (jid: string) => {
    setSelectedChat(jid);
    setMessagesLoading(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_jid', jid)
      .order('ts', { ascending: false })
      .limit(100);
    if (data) setMessages((data as WhatsAppMessage[]).reverse());
    setMessagesLoading(false);
  };

  const filteredChats = chats.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-0 flex-1">
      {/* Sidebar de chats */}
      <div className="flex w-80 shrink-0 flex-col border-r border-neutral-200">
        <div className="border-b border-neutral-200 p-4">
          <h1 className="text-lg font-bold text-neutral-900">WhatsApp</h1>
          <p className="mt-1 text-xs text-neutral-500">{chats.length} conversas</p>
          <div className="relative mt-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center text-sm text-neutral-400">
              Nenhuma conversa encontrada
            </div>
          ) : (
            filteredChats.map((chat) => {
              const contact = contacts.get(chat.jid);
              const displayName = contact?.push_name || contact?.full_name || contact?.business_name || chat.name || chat.jid.slice(0, 12);
              return (
                <button
                  key={chat.jid}
                  onClick={() => openChat(chat.jid)}
                  className={`flex w-full items-center gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                    selectedChat === chat.jid ? 'bg-[#9CD653]/10' : ''
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{displayName}</p>
                    <p className="truncate text-xs text-neutral-500">{chat.kind === 'group' ? 'Grupo' : contact?.phone || chat.jid}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-neutral-400">{formatTime(chat.last_message_ts)}</p>
                    {chat.unread && (
                      <Badge className="mt-1 bg-[#9CD653] text-neutral-900">Nova</Badge>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Painel de mensagens */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedChat ? (
          <>
            <div className="border-b border-neutral-200 p-4">
              <p className="font-medium text-neutral-900">
                {contacts.get(selectedChat)?.push_name || chats.find((c) => c.jid === selectedChat)?.name || selectedChat}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className={`h-12 w-3/4 rounded-lg ${i % 2 === 0 ? 'ml-auto' : ''}`} />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center pt-20 text-sm text-neutral-400">
                  Nenhuma mensagem
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.from_me ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 text-sm ${
                          msg.from_me
                            ? 'bg-[#9CD653] text-neutral-900'
                            : 'bg-neutral-100 text-neutral-800'
                        }`}
                      >
                        <p>{msg.display_text || msg.text}</p>
                        <p className="mt-1 text-right text-[10px] opacity-60">
                          {formatTime(msg.ts)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-neutral-200 p-4">
              <p className="text-center text-xs text-neutral-400">
                Para responder use o wacli ou a skill de outbound
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
