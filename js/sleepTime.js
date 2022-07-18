export const sleepTime = async (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};