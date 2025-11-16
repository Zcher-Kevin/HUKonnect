import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";

type Props = {
  major: string;
  setMajor: (v: string) => void;
  minor: string;
  setMinor: (v: string) => void;
  yearOfStudy: string;
  setYearOfStudy: (v: string) => void;
  styles: any;
  YEAR_OPTIONS: string[];
  SUBTEXT?: string;
};

export default function MajorMinorYear({
  major,
  setMajor,
  minor,
  setMinor,
  yearOfStudy,
  setYearOfStudy,
  styles,
  YEAR_OPTIONS,
  SUBTEXT,
}: Props) {
  const [showYear, setShowYear] = useState(false);

  return (
    <>
      <TextInput
        placeholder="Major"
        placeholderTextColor={SUBTEXT}
        style={styles.input}
        value={major}
        onChangeText={setMajor}
      />

      <TextInput
        placeholder="Minor"
        placeholderTextColor={SUBTEXT}
        style={styles.input}
        value={minor}
        onChangeText={setMinor}
      />

      <TouchableOpacity
        style={[styles.yearToggle, showYear && styles.yearToggleActive]}
        onPress={() => setShowYear((s) => !s)}
        activeOpacity={0.85}
      >
        <Text style={styles.yearToggleText}>
          {yearOfStudy ? `Year: ${yearOfStudy}` : "Select year of study"}
        </Text>
        <Text style={styles.caret}>{showYear ? "▴" : "▾"}</Text>
      </TouchableOpacity>

      {showYear && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowYear(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowYear(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>
          <View style={styles.modalWrapper} pointerEvents="box-none">
            <View style={styles.modalPanel}>
              <FlatList
                data={YEAR_OPTIONS}
                keyExtractor={(i) => i}
                initialNumToRender={4}
                windowSize={3}
                getItemLayout={(_d, index) => ({
                  length: 48,
                  offset: 48 * index,
                  index,
                })}
                renderItem={({ item: y }) => (
                  <TouchableOpacity
                    style={[
                      styles.yearListItem,
                      yearOfStudy === y && styles.navItemActive,
                    ]}
                    onPress={() => {
                      setYearOfStudy(yearOfStudy === y ? "" : y);
                      setShowYear(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.navText,
                        yearOfStudy === y && styles.navTextActive,
                      ]}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingVertical: 6 }}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}
