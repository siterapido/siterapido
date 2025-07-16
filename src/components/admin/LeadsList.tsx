import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Lead = {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  mensagem?: string;
  created_at: string;
};

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) setError(error.message);
      else setLeads(data || []);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  if (loading) return <div>Carregando leads...</div>;
  if (error) return <div className="text-red-500">Erro: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Leads Cadastrados</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2">Nome</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Telefone</th>
              <th className="px-4 py-2">Mensagem</th>
              <th className="px-4 py-2">Data</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-t">
                <td className="px-4 py-2">{lead.nome}</td>
                <td className="px-4 py-2">{lead.email}</td>
                <td className="px-4 py-2">{lead.telefone}</td>
                <td className="px-4 py-2">{lead.mensagem}</td>
                <td className="px-4 py-2">{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 