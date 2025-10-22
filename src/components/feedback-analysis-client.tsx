"use client";

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { extractKeyFeedback, ExtractKeyFeedbackOutput } from '@/ai/flows/extract-key-feedback';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function FeedbackAnalysisClient() {
  const [feedbackText, setFeedbackText] = useState('');
  const [result, setResult] = useState<ExtractKeyFeedbackOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      setError("O campo de feedback não pode estar vazio.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await extractKeyFeedback({ feedbackText });
      setResult(output);
    } catch (err) {
      setError("Ocorreu um erro ao analisar o feedback. Tente novamente.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Análise de Feedback com IA</CardTitle>
            <CardDescription>
              Cole o feedback dos alunos abaixo para extrair palavras-chave
              positivas e negativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="feedback-text" className="sr-only">
                Texto do Feedback
              </Label>
              <Textarea
                id="feedback-text"
                placeholder="Ex: A aula foi muito boa, o professor explicou tudo com clareza. Porém, a conexão estava um pouco instável."
                rows={8}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isLoading} className="ml-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analisar Feedback
            </Button>
          </CardFooter>
        </Card>
      </form>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Resultados da Análise</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Palavras-chave Positivas</h3>
              <div className="flex flex-wrap gap-2">
                {result.positiveKeywords.split(',').map((keyword) => (
                  <Badge key={keyword} variant="outline" className="bg-accent text-accent-foreground border-green-300">
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Palavras-chave Negativas</h3>
              <div className="flex flex-wrap gap-2">
                {result.negativeKeywords.split(',').map((keyword) => (
                  <Badge key={keyword} variant="destructive">
                    {keyword.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
