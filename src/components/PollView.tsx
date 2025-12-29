
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert } from 'react-native';
import { Poll } from '@/types/poll';
import { useTheme } from '@/theme/theme';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

interface PollViewProps {
  poll: Poll;
  postId: string;
}

import { SyncEngine } from '@/lib/sync/SyncEngine';

export default function PollView({ poll: initialPoll, postId }: PollViewProps) {
  const { theme } = useTheme();
  const [poll, setPoll] = useState(initialPoll);
  const [isVoting, setIsVoting] = useState(false);

  // Sync with prop updates if needed (e.g. from websocket/simulation)
  React.useEffect(() => {
    setPoll(initialPoll);
  }, [initialPoll]);

  if (!poll || !poll.choices) return null;

  const hasVoted = poll.userVoteIndex !== undefined;
  const isExpired = new Date(poll.expiresAt) < new Date();
  const showResults = hasVoted || isExpired;

  const handleVote = async (index: number) => {
    if (showResults || isVoting) return;
    setIsVoting(true);
    try {
      // Optimistic Update
      const newPoll = { ...poll };
      if (!newPoll.choices[index].vote_count) newPoll.choices[index].vote_count = 0;
      newPoll.choices[index].vote_count++;
      newPoll.userVoteIndex = index;
      newPoll.totalVotes = (Number(newPoll.totalVotes) || 0) + 1;

      setPoll(newPoll);

      // Use SyncEngine for offline support
      await SyncEngine.votePoll(postId, index);

      // Note: SyncEngine.votePoll is void, it triggers a bg sync.
      // We rely on optimistic update above.
      // If sync fails later, it will retry. 
      // If we need to revert on persistent failure, that's complex, 
      // but for now this is standard PWA/Offline-First behavior.

    } catch (error: any) {
      console.error('Failed to vote:', error);

      // Revert optimistic update nicely if immediate local error (e.g. auth)
      setPoll(initialPoll); // Revert to prop state

      const errorMessage = error.message || 'An unexpected error occurred';

      Alert.alert(
        'Poll Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsVoting(false);
    }
  };

  const calculatePercentage = (count: number) => {
    const total = Number(poll.totalVotes) || 0;
    if (total === 0) return 0;
    return Math.round((Number(count) || 0) / total * 100);
  };

  return (
    <View style={styles.container}>
      {poll.choices.map((choice, index) => {
        const percentage = calculatePercentage(choice.vote_count);
        const isUserChoice = poll.userVoteIndex === index;

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.choiceButton,
              { borderColor: theme.borderLight },
              showResults && styles.choiceStatic
            ]}
            onPress={() => handleVote(index)}
            disabled={showResults || isVoting}
            activeOpacity={0.7}
          >
            {showResults && (
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${percentage}%`,
                    backgroundColor: (choice.color || ['#1DA1F2', '#17BF63', '#FFAD1F', '#E0245E', '#794BC4'][index % 5]) + '33'
                  }
                ]}
              />
            )}

            <View style={styles.choiceContent}>
              <Text
                style={[
                  styles.choiceText,
                  { color: theme.textPrimary, fontWeight: isUserChoice ? 'bold' : 'normal' }
                ]}
              >
                {choice.text}
              </Text>
              {showResults && (
                <View style={styles.resultInfo}>
                  {isUserChoice && (
                    <Ionicons name="checkmark-circle" size={16} color={theme.primary} style={styles.checkIcon} />
                  )}
                  <Text style={[styles.percentageText, { color: theme.textPrimary }]}>
                    {percentage}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textTertiary }]}>
          {Number(poll.totalVotes) || 0} votes · {isExpired ? 'Final results' : 'Active'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    gap: 8,
  },
  choiceButton: {
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  choiceStatic: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 4,
  },
  choiceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  choiceText: {
    fontSize: 15,
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 20,
  },
  checkIcon: {
    marginRight: 4,
  },
  footer: {
    marginTop: 2,
  },
  footerText: {
    fontSize: 13,
  },
});
