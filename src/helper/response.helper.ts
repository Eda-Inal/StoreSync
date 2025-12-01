export const sendResponse = (data:any, status?:number) => {
    return {
        success: true,
        statusCode: status || 200,
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