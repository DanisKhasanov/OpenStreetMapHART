import { useSnackbar, OptionsObject, SnackbarMessage } from "notistack";

const useCustomSnackbar = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showSnackbar = (message: SnackbarMessage, options?: OptionsObject) => {
    enqueueSnackbar(message, {
      anchorOrigin: {
        vertical: "bottom",
        horizontal: "right",
      },
      autoHideDuration: 2000,
      ...options,
    });
  };

  return { showSnackbar };
};

export { useCustomSnackbar };
export default useCustomSnackbar;
