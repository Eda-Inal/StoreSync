export const sendResponse = (data:any) => {
    return {
        success: true,
        data,
    }
}

export const sendError = (message:string, status?:number) => {
    return {
        success: false,
        statusCode: status || 500,
        message,
    };
};