'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { db } from '@/lib/supabase-db';
import { Title, Avatar, Text, Stack, Paper, Group, Badge } from '@mantine/core';
import { IconShield, IconStar } from '@tabler/icons-react';
import React from 'react';

export default function UserProfile({ params: paramsPromise }: { params: Promise<{ nick: string }> }) {
  const params = React.use(paramsPromise);
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await db.users.getUserByNick(params.nick);
        if (!userData) {
          setError('Użytkownik nie istnieje.');
          return;
        }
        const userPosts = await db.users.getUserPosts(params.nick);
        setUser(userData);
        setPosts(userPosts);
      } catch (err) {
        console.error('Błąd podczas pobierania danych użytkownika:', err);
        setError('Wystąpił błąd podczas ładowania profilu.');
      }
    };
    fetchData();
  }, [params.nick]);

  if (error) return <Text c="red">{error}</Text>;
  if (!user) return <Text>Ładowanie...</Text>;

  return (
    <Stack p="md" maw={800} mx="auto">
      <Group>
        <Avatar src={user.avatar} size="xl" />
        <Stack gap="xs">
          <Group>
            <Title order={2}>{user.nick}</Title>
            {user.role === 'Moderacja' && (
              <Badge color="blue" leftSection={<IconShield size={14} />}>Moderacja</Badge>
            )}
            {user.role === 'Sponsor' && (
              <Badge color="yellow" leftSection={<IconStar size={14} />}>Sponsor</Badge>
            )}
          </Group>
          <Text>{user.description || 'Brak opisu'}</Text>
          <Text size="sm" c="dimmed">Dołączył: {new Date(user.joined_at).toLocaleDateString()}</Text>
        </Stack>
      </Group>
      <Text size="lg" mt="md">Ostatnie wpisy:</Text>
      {posts.map((post) => (
        <Paper key={post.id} p="md" withBorder>
          <Text>{post.content}</Text>
          <Text size="sm" c="dimmed">{new Date(post.timestamp).toLocaleString()}</Text>
        </Paper>
      ))}
    </Stack>
  );
}