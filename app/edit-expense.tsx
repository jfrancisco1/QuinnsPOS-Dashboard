import { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { DatePickerInput } from "@/components/ui/date-picker-input";
import { TextInput } from "@/components/ui/text-input";
import { useAuth } from "@/context/auth-context";
import { ExpenseCategoryPicker } from "@/features/expenses/components/expense-category-picker";
import { useExpenseCategories } from "@/features/expenses/hooks/use-expense-categories";
import { deleteExpense, updateExpense } from "@/lib/api";

function isoToDate(iso: string) {
  const [yyyy, mm, dd] = iso.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function toIso(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export default function EditExpenseScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    description: string;
    amount: string;
    expense_date: string;
    note: string;
    expense_category_id: string;
  }>();

  const { categories } = useExpenseCategories({ token });
  const expenseId = params.id ?? "";
  const [description, setDescription] = useState(params.description ?? "");
  const [amount, setAmount] = useState(params.amount ?? "");
  const [expenseDate, setExpenseDate] = useState(
    params.expense_date ? isoToDate(params.expense_date) : new Date(),
  );
  const [note, setNote] = useState(params.note ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    params.expense_category_id ? Number(params.expense_category_id) : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!description.trim()) {
      setError("Description is required.");
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      setError("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const result = await updateExpense(token!, expenseId, {
      description: description.trim(),
      amount: parseFloat(amount),
      expense_date: toIso(expenseDate),
      note: note.trim() || null,
      expense_category_id: categoryId ?? undefined,
    });
    setIsSubmitting(false);
    if (result.ok) {
      router.back();
    } else {
      setError(`[${result.error.status}] ${result.error.message}`);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Expense", `Delete "${description}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          await deleteExpense(token!, expenseId);
          setIsDeleting(false);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-page dark:bg-page-dark">
      <View className="gap-4 p-4">
        <TextInput
          label="Description *"
          placeholder="e.g. Detergent supplies"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
          autoCorrect={false}
        />
        <TextInput
          label="Amount *"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <DatePickerInput
          label="Date *"
          value={expenseDate}
          onChange={setExpenseDate}
        />
        <ExpenseCategoryPicker
          categories={categories}
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
        />
        <TextInput
          label="Note"
          placeholder="Optional note"
          value={note}
          onChangeText={setNote}
          autoCapitalize="sentences"
          autoCorrect={false}
        />

        {error ? (
          <Text className="text-sm text-red-500 dark:text-red-400">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSubmitting}
          className={`w-full items-center rounded-xl bg-primary py-3.5${isSubmitting ? " opacity-50" : ""}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-white">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className={`w-full items-center rounded-xl border border-red-300 py-3.5 dark:border-red-800${isDeleting ? " opacity-50" : ""}`}
          activeOpacity={0.8}
        >
          <Text className="text-sm font-semibold text-red-600 dark:text-red-400">
            {isDeleting ? "Deleting..." : "Delete Expense"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
