import { useContext } from "react";
import { GoogleOneTapContext } from "./GoogleOneTap";

export default function useGoogleOneTap() {
  return useContext(GoogleOneTapContext);
}
