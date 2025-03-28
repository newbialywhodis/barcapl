'use client';

import { Modal, TextInput, PasswordInput, Button, Stack, Anchor, Group, Notification } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useToggle } from '@mantine/hooks';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { notifications } from '@mantine/notifications';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function AuthModal({ opened, onClose }: AuthModalProps) {
  const [type, toggle] = useToggle(['login', 'register']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
      nick: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : 'Nieprawidłowy email'),
      nick: (val) => (type === 'register' && val.length < 3 ? 'Nick musi mieć co najmniej 3 znaki' : null),
      password: (val) => (val.length < 6 ? 'Hasło musi mieć co najmniej 6 znaków' : null),
      confirmPassword: (val, values) =>
        type === 'register' && val !== values.password ? 'Hasła muszą się zgadzać' : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    console.log('Formularz przed wysłaniem:', values);

    if (type === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      console.log('Logowanie:', { data, error });
      if (error) {
        setError(error.message);
        notifications.show({
          title: 'Błąd logowania',
          message: error.message,
          color: 'red',
        });
      } else if (data.session) {
        form.reset();
        setSuccess('Zalogowano pomyślnie');
        setTimeout(onClose, 1000);
      } else {
        setError('Logowanie nie powiodło się - brak sesji');
      }
    } else {
      const { data: emailCheck, error: emailError } = await supabase
        .from('users')
        .select('email')
        .eq('email', values.email)
        .maybeSingle();
      console.log('Sprawdzenie emaila:', { emailCheck, emailError });
      if (emailCheck) {
        form.setFieldError('email', 'Ten email jest już zajęty');
        setError('Ten email jest już zajęty');
        setLoading(false);
        return;
      }

      const { data: nickCheck, error: nickError } = await supabase
        .from('users')
        .select('nick')
        .eq('nick', values.nick.toLowerCase())
        .maybeSingle();
      console.log('Sprawdzenie nicku:', { nickCheck, nickError });
      if (nickCheck) {
        form.setFieldError('nick', 'Ten nick jest już zajęty');
        setError('Ten nick jest już zajęty');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            nick: values.nick.toLowerCase(),
            role: null,
            joined_at: new Date().toISOString(),
          },
        },
      });
      console.log('Rejestracja:', { data, error });
      if (error) {
        setError(error.message);
        notifications.show({
          title: 'Błąd rejestracji',
          message: error.message,
          color: 'red',
        });
      } else if (data.user) {
        form.reset();
        setSuccess('Zarejestrowano! Sprawdź swój email, aby potwierdzić konto.');
        setTimeout(() => {
          toggle();
          setSuccess(null);
        }, 2000);
      }
    }
    setLoading(false);
  };

  return (
    <Modal opened={opened} onClose={onClose} title={type === 'login' ? 'Zaloguj się' : 'Zarejestruj się'} centered>
      {error && (
        <Notification color="red" title="Błąd" onClose={() => setError(null)} mb="md">
          {error}
        </Notification>
      )}
      {success && (
        <Notification color="green" title="Sukces" onClose={() => setSuccess(null)} mb="md">
          {success}
        </Notification>
      )}
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label="Email"
            placeholder="Twój email"
            required
            {...form.getInputProps('email')}
            disabled={loading}
          />
          {type === 'register' && (
            <TextInput
              label="Nick"
              placeholder="Twój nick"
              required
              {...form.getInputProps('nick')}
              disabled={loading}
            />
          )}
          <PasswordInput
            label="Hasło"
            placeholder="Twoje hasło"
            required
            {...form.getInputProps('password')}
            disabled={loading}
          />
          {type === 'register' && (
            <PasswordInput
              label="Powtórz hasło"
              placeholder="Powtórz hasło"
              required
              {...form.getInputProps('confirmPassword')}
              disabled={loading}
            />
          )}
          <Group justify="space-between" mt="md">
            <Anchor
              component="button"
              type="button"
              c="dimmed"
              onClick={() => {
                toggle();
                form.reset();
                setError(null);
                setSuccess(null);
              }}
              size="sm"
              disabled={loading}
            >
              {type === 'register' ? 'Masz konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </Anchor>
            <Button type="submit" loading={loading}>
              {type === 'login' ? 'Zaloguj się' : 'Zarejestruj się'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}