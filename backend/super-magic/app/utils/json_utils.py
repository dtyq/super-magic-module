import json


def json_dumps(obj, **kwargs):
    """
    Wrapper for json.dumps that sets ensure_ascii=False by default.
    
    Args:
        obj: The Python object to be converted to JSON.
        **kwargs: Additional keyword arguments to pass to json.dumps.
        
    Returns:
        str: JSON string representation with non-ASCII characters preserved.
    """
    kwargs.setdefault('ensure_ascii', False)
    return json.dumps(obj, **kwargs) 
