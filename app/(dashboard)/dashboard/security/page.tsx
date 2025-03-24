'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2 } from 'lucide-react';
import { startTransition, useActionState } from 'react';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const [passwordState, passwordAction, isPasswordPending] = useActionState<ActionState, FormData>(updatePassword, { error: '', success: '' });

  const [deleteState, deleteAction, isDeletePending] = useActionState<ActionState, FormData>(deleteAccount, { error: '', success: '' });

  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    // If you call the Server Action directly, it will automatically
    // reset the form. We don't want that here, because we want to keep the
    // client-side values in the inputs. So instead, we use an event handler
    // which calls the action. You must wrap direct calls with startTransition.
    // When you use the `action` prop it automatically handles that for you.
    // Another option here is to persist the values to local storage. I might
    // explore alternative options.
    startTransition(() => {
      passwordAction(new FormData(event.currentTarget));
    });
  };

  const handleDeleteSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    startTransition(() => {
      deleteAction(new FormData(event.currentTarget));
    });
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Paramètres de Sécurité
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handlePasswordSubmit}>
            <div>
              <Label htmlFor="current-password">Mot de passe actuel</Label>
              <Input
                id="current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <Input
                id="new-password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {passwordState.error && (
              <p className="text-red-500 text-sm">{passwordState.error}</p>
            )}
            {passwordState.success && (
              <p className="text-green-500 text-sm">{passwordState.success}</p>
            )}
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isPasswordPending}
            >
              {isPasswordPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Mettre à jour le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supprimer le compte</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            La suppression du compte est irréversible. Veuillez procéder avec précaution.
          </p>
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <div>
              <Label htmlFor="delete-password">Confirmer le mot de passe</Label>
              <Input
                id="delete-password"
                name="password"
                type="password"
                required
                minLength={8}
                maxLength={100}
              />
            </div>
            {deleteState.error && (
              <p className="text-red-500 text-sm">{deleteState.error}</p>
            )}
            <Button
              type="submit"
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletePending}
            >
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le compte
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
