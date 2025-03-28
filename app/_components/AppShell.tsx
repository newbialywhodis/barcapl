'use client';

import React from 'react';
import {
  AppShell as MantineAppShell,
  Burger,
  Group,
  Button,
  Text,
  NavLink,
  Avatar,
  Menu,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { IconShield, IconStar, IconSettings, IconLogout, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
import AuthModal from './AuthModal';
import { useSearchParams } from 'next/navigation';
import { notifications, Notifications } from '@mantine/notifications';
import { Session } from '@supabase/supabase-js';

interface AppShellProps {
  children: React.ReactNode;
}

export default function CustomAppShell({ children }: AppShellProps) {
  const [opened, { toggle }] = useDisclosure();
  const [authModalOpened, setAuthModalOpened] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isHomeActive, setIsHomeActive] = useState(false);
  const [isLaRamblaActive, setIsLaRamblaActive] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        console.log('Ustawiam is_online na true dla nicku:', session.user.user_metadata.nick);
        const { error } = await supabase
          .from('users')
          .update({ is_online: true })
          .eq('nick', session.user.user_metadata.nick);
        if (error) console.error('Błąd aktualizacji is_online:', error);
      }
    };
    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        console.log('Logowanie - ustawiam is_online na true dla:', session.user.user_metadata.nick);
        const { error } = await supabase
          .from('users')
          .update({ is_online: true })
          .eq('nick', session.user.user_metadata.nick);
        if (error) console.error('Błąd przy logowaniu:', error);
      } else if (event === 'SIGNED_OUT') {
        console.log('Wylogowanie - ustawiam is_online na false dla:', session?.user.user_metadata.nick || 'unknown');
        if (session) {
          const { error } = await supabase
            .from('users')
            .update({ is_online: false })
            .eq('nick', session.user.user_metadata.nick);
          if (error) console.error('Błąd przy wylogowaniu:', error);
        }
      }
    });

    setIsHomeActive(window.location.pathname === '/');
    setIsLaRamblaActive(window.location.pathname === '/la-rambla');

    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (error) {
      notifications.show({
        title: 'Błąd',
        message: errorDescription || 'Wystąpił błąd. Spróbuj ponownie.',
        color: 'red',
      });
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSignOut = async () => {
    if (session) {
      console.log('Wylogowanie dla nicku:', session.user.user_metadata.nick);
      const { error } = await supabase
        .from('users')
        .update({ is_online: false })
        .eq('nick', session.user.user_metadata.nick);
      if (error) console.error('Błąd przy wylogowaniu:', error);
      await supabase.auth.signOut();
      setSession(null);
    }
  };

  return (
    <>
      <Notifications />
      <MantineAppShell
        header={{ height: 60 }}
        navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened } }}
        padding="md"
      >
        <MantineAppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
              <Text>FC Barca</Text>
            </Group>
            {session ? (
              <Menu withArrow width={300} position="bottom-end" transitionProps={{ transition: 'pop' }}>
                <Menu.Target>
                  <Avatar
                    src={session.user.user_metadata.avatar || null}
                    radius="xl"
                    size="md"
                    style={{ cursor: 'pointer' }}
                  />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    component={Link}
                    href={`/user/${session.user.user_metadata.nick}`}
                    rightSection={<IconChevronRight size={16} stroke={1.5} />}
                  >
                    <Group>
                      <Avatar
                        src={session.user.user_metadata.avatar || null}
                        radius="xl"
                      />
                      <div>
                        <Text fw={500}>{session.user.user_metadata.nick}</Text>
                        <Text size="xs" c="dimmed">{session.user.email}</Text>
                      </div>
                    </Group>
                  </Menu.Item>
                  <Divider />
                  <Menu.Item leftSection={<IconSettings size={16} />}>
                    Ustawienia konta
                  </Menu.Item>
                  <Menu.Item
                    leftSection={<IconLogout size={16} />}
                    onClick={handleSignOut}
                  >
                    Wyloguj
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Button onClick={() => setAuthModalOpened(true)}>Zaloguj</Button>
            )}
          </Group>
        </MantineAppShell.Header>
        <MantineAppShell.Navbar p="md">
          <NavLink
            label="Strona główna"
            component={Link}
            href="/"
            active={isHomeActive}
          />
          <NavLink
            label="La Rambla"
            component={Link}
            href="/la-rambla"
            active={isLaRamblaActive}
          />
        </MantineAppShell.Navbar>
        <MantineAppShell.Main>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ session?: Session | null }>, { session })
              : child
          )}
        </MantineAppShell.Main>
        <AuthModal opened={authModalOpened} onClose={() => setAuthModalOpened(false)} />
      </MantineAppShell>
    </>
  );
}