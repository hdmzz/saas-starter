'use client';

import React, { startTransition, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { generateDescription } from '@/app/(dashboard)/dashboard/description/actions'; 
import { useUser } from '@/lib/auth';

type ActionState = {
  error?: string;
  description?: string;
};

export default function DescriptionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ActionState>({});
  const [preview, setPreview] = useState<string | null>(null);
  const {refreshUser} = useUser();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      const response = await generateDescription(formData);
      
      if (response.error) {
        setResult({ error: response.error });
      } else if (response.description) {
        setResult({ description: response.description });
        await refreshUser();
      }
    } catch (error) {
      setResult({ error: "Une erreur s'est produite lors de la génération de la description" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Vinted Sales Booster
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Générer une description pour votre article</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="image">Photo de l'article</Label>
              <Input
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
              {preview && (
                <div className="mt-4">
                  <img 
                    src={preview} 
                    alt="Aperçu" 
                    className="max-w-xs rounded-lg shadow-md"
                  />
                </div>
              )}
            </div>

            {result.error && (
              <p className="text-red-500 text-sm">{result.error}</p>
            )}
            
            {result.description && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Label>Description générée:</Label>
                <p className="text-gray-700 mt-2">{result.description}</p>
              </div>
            )}

            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                'Générer la description'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
