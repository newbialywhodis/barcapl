'use client';

import { Paper, Group, Avatar, Text, ActionIcon, Stack, Indicator, Tooltip, ThemeIcon, Menu } from '@mantine/core';
import { notifications } from '@mantine/notifications'; // Zmień import
import { IconHeart, IconLeaf, IconShield, IconUserPlus, IconUser, IconFlag } from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';
import Link from 'next/link';

interface PostProps {
  post: {
    id: string;
    author: string;
    content: string;
    timestamp: string;
    is_online?: boolean;
    role?: string | null;
    joined_at?: string;
  };
  onLike: (postId: string) => void;
  session: any;
  likesCount: number;
  isLiked: boolean;
}

export default function Post({ post, onLike, session, likesCount, isLiked }: PostProps) {
  console.log('Post props:', { post, is_online: post.is_online });

  const isNewUser = post.joined_at
    ? (new Date().getTime() - new Date(post.joined_at).getTime()) / (1000 * 60 * 60) < 24
    : false;

  const getRoleIcons = () => {
    const icons = [];
    if (isNewUser) {
      icons.push(
        <Tooltip label="Nowy użytkownik" key="new">
          <ThemeIcon color="green" size="sm" variant="light" radius="md">
            <IconLeaf size={20} />
          </ThemeIcon>
        </Tooltip>
      );
    }
    if (post.role === 'Sponsor') {
      icons.push(
        <Tooltip label="Sponsor" key="sponsor">
          <ThemeIcon color="yellow" size="sm" variant="light" radius="md">
            <IconLeaf size={20} />
          </ThemeIcon>
        </Tooltip>
      );
    }
    if (post.role === 'Moderacja') {
      icons.push(
        <Tooltip label="Moderator" key="moderation">
          <ThemeIcon color="blue" size="sm" variant="light" radius="md">
            <IconShield size={20} />
          </ThemeIcon>
        </Tooltip>
      );
    }
    return icons;
  };

  const timeAgo = formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: pl });
  const joinedDate = post.joined_at ? new Date(post.joined_at).toLocaleDateString('pl-PL') : 'Brak daty';

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between">
        <Group>
          <Menu withArrow position="bottom-start" transitionProps={{ transition: 'pop' }}>
            <Menu.Target>
              <Indicator
                color="green"
                disabled={post.is_online !== true} // Wyraźne sprawdzenie true
                size={12}
                offset={4}
                withBorder
              >
                <Avatar size="md" radius="xl" style={{ cursor: 'pointer' }} />
              </Indicator>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item disabled>
                <Group>
                  <Avatar size="md" radius="xl" />
                  <Stack gap={0}>
                    <Text fw={500}>{post.author}</Text>
                    <Text size="xs" c="dimmed">Dołączył: {joinedDate}</Text>
                  </Stack>
                </Group>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item leftSection={<IconUserPlus size={16} />}>
                Zaobserwuj
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUser size={16} />}
                component={Link}
                href={`/user/${post.author}`}
              >
                Pokaż profil
              </Menu.Item>
              <Menu.Item leftSection={<IconFlag size={16} />} color="red">
                Zgłoś
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Stack gap={0}>
            <Group gap={4}>
              <Text fw={500}>{post.author}</Text>
              {getRoleIcons()}
            </Group>
            <Text size="sm" c="dimmed">{timeAgo}</Text>
          </Stack>
        </Group>
        <Group gap={4}>
          <ActionIcon
            variant={isLiked ? 'filled' : 'outline'}
            color={isLiked ? 'red' : 'gray'}
            onClick={() => {
              if (!session) {
                notifications.show({
                  title: 'Uwaga',
                  message: 'Musisz najpierw się zalogować',
                  color: 'red',
                });
              } else {
                onLike(post.id);
              }
            }}
          >
            <IconHeart size={16} />
          </ActionIcon>
          <Text size="sm">{likesCount}</Text>
        </Group>
      </Group>
      <Text mt="sm">{post.content}</Text>
    </Paper>
  );
}
