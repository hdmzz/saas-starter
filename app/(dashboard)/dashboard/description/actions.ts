'use server';

import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { users } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export async function generateDescription(formData: FormData) {
  const user = await getUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  if (!user.tokens || user.tokens <= 0) {
    return {
      error: "Vous n'avez plus de tokens disponibles. Veuillez recharger votre compte."
    };
  }

  const image = formData.get('image') as File;
  if (!image) {
    return {
      error: "Aucune image n'a été fournie"
    };
  }

  try {
    // TODO: Implémenter l'appel à l'API de génération d'image
    // Exemple de logique :
    // 1. Upload l'image vers un service de stockage
    // 2. Appeler l'API de génération de description
    // 3. Décrémenter les tokens de l'utilisateur
    
    // Simulation d'une réponse
    const description = "Ceci est une description générée automatiquement...";
    
    // Décrémenter les tokens
    await db.update(users)
      .set({ 
        tokens: user.tokens - 1,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    return { description };
  } catch (error) {
    console.error('Error generating description:', error);
    return {
      error: "Une erreur s'est produite lors de la génération de la description"
    };
  }
}
