import { useContext } from "react";
import OneTapContext from "./OneTapContext";

export default function useGoogleOneTap() {
  return useContext(OneTapContext);
}
