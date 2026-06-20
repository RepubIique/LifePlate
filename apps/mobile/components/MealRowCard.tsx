import { StyleSheet, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";
import { MealImage } from "@/components/MealImage";
import { premiumStyles } from "@/src/theme/premium";
import { spacing } from "@/src/theme/lifeplate";

export function MealRowCard({
  mealId,
  mealName,
  subtitle,
  mealType,
  imageUrl,
  onPress,
  onDelete,
}: {
  mealId?: string;
  mealName: string;
  subtitle: string;
  mealType?: string | null;
  imageUrl?: string | null;
  onPress?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card style={premiumStyles.mealCard} onPress={onPress}>
      <Card.Content style={styles.row}>
        <MealImage
          mealId={mealId}
          cloudUrl={imageUrl}
          mealType={mealType}
          style={premiumStyles.thumb}
          placeholderStyle={premiumStyles.thumbPlaceholder}
        />
        <View style={styles.text}>
          <Text variant="titleMedium">{mealName}</Text>
          <Text variant="bodySmall" style={styles.sub}>
            {subtitle}
          </Text>
        </View>
        {onDelete ? (
          <IconButton
            icon="delete-outline"
            onPress={onDelete}
            accessibilityLabel="Delete meal"
          />
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  text: { flex: 1 },
  sub: { opacity: 0.65, marginTop: 2 },
});
