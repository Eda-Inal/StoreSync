export const sendResponse = (data:any, status?:number) => {
    return {
        success: true,
        data,
    }
}

export const sendError = (message:string, status?:number) => {
    return {
        success: false,
        message,
    };
};