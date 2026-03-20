import { Text, View } from 'react-native';

export type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export function Card({ title, children }: CardProps) {
  return (
    <View
      className="rounded-3xl bg-white px-5 py-5 dark:bg-card-dark"
      style={{
        shadowColor: '#1A1F3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
        elevation: 3,
      }}
    >
      {title && (
        <Text className="mb-3 text-xs font-bold uppercase tracking-widest text-muted">
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}
